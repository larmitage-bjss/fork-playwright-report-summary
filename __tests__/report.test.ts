/**
 * Unit tests for src/report.ts
 */

import { expect } from '@jest/globals'
import { readFile } from '../src/fs'
import { ReportSummary, isValidReport, parseSpecsRecursively, parseReport, renderReportSummary } from '../src/report'

const defaultReport = 'report-valid.json'

async function getReport(file = defaultReport): Promise<string> {
	return await readFile(`__tests__/__fixtures__/${file}`)
}

async function getParsedReport(file = defaultReport): Promise<ReportSummary> {
	return parseReport(await getReport(file))
}

describe('isValidReport', () => {
	it('detects valid reports', async () => {
		const report = await getReport()
		expect(isValidReport(JSON.parse(report))).toBe(true)
	})
	it('detects invalid reports', async () => {
		const report = await getReport('report-invalid.json')
		expect(isValidReport([])).toBe(false)
		expect(isValidReport('')).toBe(false)
		expect(isValidReport(JSON.parse(report))).toBe(false)
	})
})

describe('parseSpecsRecursively', () => {
  it('returns an object', async () => {
    const result = parseSpecsRecursively([], [])
    expect(typeof result === 'object').toBe(true)
  })
  it('returns an empty array', async () => {
    const result = parseSpecsRecursively([], [
    {
      "title": "functional-integration/desktop/tailwind-desktop.spec.ts",
      "file": "functional-integration/desktop/tailwind-desktop.spec.ts",
      "column": 0,
      "line": 0,
      "specs": [],
      "suites": []
    }])
    expect(result.length).toBe(0)
  })
  it('returns one item', async () => {
    const result = parseSpecsRecursively([], [
    {
      "title": "functional-integration/desktop/tailwind-desktop.spec.ts",
      "file": "functional-integration/desktop/tailwind-desktop.spec.ts",
      "column": 0,
      "line": 0,
      "specs": [
        {
          "title": "users clicks on the Customer API button trigger a call to the Customer API | @JIRA-0001",
          "ok": true,
          "tags": [],
          "tests": [
            {
              "timeout": 60000,
              "annotations": [
                {
                  "type": "testId",
                  "description": "5fae39cd70b340418e08-35e7560fe72ea3ee5bb1"
                }
              ],
              "expectedStatus": "passed",
              "projectId": "chromium",
              "projectName": "chromium",
              "results": [
                {
                  "workerIndex": 0,
                  "status": "passed",
                  "duration": 3818,
                  "errors": [],
                  "stdout": [
                    {
                      "text": "[2024-04-15T09:08:05.723Z] \u001b[32minfo\u001b[39m: \"users clicks on the Customer API button trigger a call to the Customer API\" | TestId: 5fae39cd70b340418e08-35e7560fe72ea3ee5bb1\n"
                    }
                  ],
                  "stderr": [],
                  "retry": 0,
                  "startTime": "2024-04-15T09:08:05.523Z",
                  "attachments": []
                }
              ],
              "status": "expected"
            }
          ],
          "id": "5fae39cd70b340418e08-35e7560fe72ea3ee5bb1",
          "file": "functional-integration/multidevice/tailwind-multidevice.spec.ts",
          "line": 15,
          "column": 9
        },
      ],
      "suites": []
    }])
    expect(result.length).toBe(0)
  })
})

describe('parseReport', () => {
  it('returns an object', async () => {
    const parsed = await getParsedReport()
    expect(typeof parsed === 'object').toBe(true)
  })
  it('returns playwright version', async () => {
    const parsed = await getParsedReport()
    expect(parsed.version).toBe('1.37.1')
  })
  it('returns total duration', async () => {
    const parsed = await getParsedReport()
    expect(parsed.duration).toBe(1118.34)
  })
  it('calculates duration if missing', async () => {
    const parsed = await getParsedReport('report-without-duration.json')
    expect(parsed.duration).toBe(943)
  })
  it('returns workers', async () => {
    const parsed = await getParsedReport()
    expect(parsed.workers).toBe(5)
  })
  it('returns shards', async () => {
    const parsed = await getParsedReport()
    expect(parsed.shards).toBe(2)
  })
  it('returns files', async () => {
    const parsed = await getParsedReport()
    expect(parsed.files.length).toBe(4)
  })
  it('returns suites', async () => {
    const parsed = await getParsedReport()
    expect(parsed.suites.length).toBe(4)
  })
  it('returns specs', async () => {
    const parsed = await getParsedReport()
    expect(parsed.specs.length).toBe(14)
  })
  it('counts tests', async () => {
    const parsed = await getParsedReport()
    expect(parsed.tests.length).toBe(14)
    expect(parsed.failed.length).toBe(2)
    expect(parsed.passed.length).toBe(10)
    expect(parsed.flaky.length).toBe(1)
    expect(parsed.skipped.length).toBe(1)
  })
  it('counts sharded tests', async () => {
    const parsed = await getParsedReport('report-sharded.json')
    expect(parsed.tests.length).toBe(27)
    expect(parsed.failed.length).toBe(1)
    expect(parsed.passed.length).toBe(22)
    expect(parsed.flaky.length).toBe(1)
    expect(parsed.skipped.length).toBe(3)
  })
})

describe('renderReportSummary', () => {
	const renderOptions = {
		title: 'Test Report',
		reportUrl: 'https://example.com/report',
		commit: '1234567'
	}
	const getReportSummary = async (): Promise<string> =>
		renderReportSummary(parseReport(await getReport()), renderOptions)
	it('returns a string', async () => {
		const summary = await getReportSummary()
		expect(typeof summary === 'string').toBe(true)
	})
	it('matches snapshot', async () => {
		const summary = await getReportSummary()
		expect(summary).toMatchSnapshot()
	})
})
