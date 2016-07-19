'use strict'

const Base = require('gitlint-parser-base')

const revertRE = /Revert "(.*)"$/
const workingRE = /Working on v([\d]+)\.([\d]+).([\d]+)$/
const releaseRE = /([\d]{4})-([\d]{2})-([\d]{2}),? Version/
const reviewedByRE = /Reviewed-By: (.*)/
const fixesRE = /Fixes: (.*)/
const prUrlRE = /PR-URL: (.*)/

module.exports = class Parser extends Base {
  constructor(str, validator) {
    super(str, validator)
    this.subsystems = []
    this.fixes = []
    this.prUrl = null
    this.reviewers = []
    this._parse()
  }

  _parse() {
    const revert = this.isRevert()
    if (!revert) {
      this.subsystems = getSubsystems(this.title || '')
    } else {
      const matches = this.title.match(revertRE)
      if (matches) {
        const title = matches[1]
        this.subsystems = getSubsystems(title)
      }
    }

    for (let i = 0; i < this.body.length; i++) {
      const line = this.body[i]
      const reviewedBy = line.match(reviewedByRE)
      if (reviewedBy) {
        this.reviewers.push(reviewedBy[1])
        continue
      }

      const fixes = line.match(fixesRE)
      if (fixes) {
        this.fixes.push(fixes[1])
        continue
      }

      const prUrl = line.match(prUrlRE)
      if (prUrl) {
        this.prUrl = prUrl[1]
        continue
      }
    }
  }

  isRevert() {
    return revertRE.test(this.title)
  }

  isWorkingCommit() {
    return workingRE.test(this.title)
  }

  isReleaseCommit() {
    return releaseRE.test(this.title)
  }

  toJSON() {
    return {
      sha: this.sha
    , title: this.title
    , subsystems: this.subsystems
    , author: this.author
    , date: this.date
    , fixes: this.fixes
    , prUrl: this.prUrl
    , reviewers: this.reviewers
    , body: this.body
    , revert: this.isRevert()
    , release: this.isReleaseCommit()
    , working: this.isWorkingCommit()
    }
  }
}

function getSubsystems(str) {
  str = str || ''
  const colon = str.indexOf(':')
  if (colon === -1) {
    return []
  }

  const subStr = str.slice(0, colon)
  const subs = subStr.split(',')
  return subs.map((item) => {
    return item.trim()
  })
}
