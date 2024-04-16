/**
 * Unit tests for the action's entrypoint, src/index.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as github from '@actions/github'
import * as index from '../src/index'
import { Context } from '@actions/github/lib/context'

// Mock the GitHub Actions core library
let debugMock: jest.SpiedFunction<typeof core.debug>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>

// Mock the action's entrypoint
const runMock = jest.spyOn(index, 'run')

// Shallow clone original @actions/github context
// @ts-expect-error missing issue and repo keys
const originalContext: Context = { issue: {}, ...github.context }

// Inputs for mock @actions/core
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let inputs: Record<string, string> = {}

function setContext(context: Context): void {
	Object.defineProperty(github, 'context', { value: context, writable: true })
}

describe('action', () => {
	beforeAll(() => {
		// Mock github context
		jest.spyOn(github.context, 'repo', 'get').mockImplementation(() => {
			return {
				owner: 'some-owner',
				repo: 'some-repo'
			}
		})
	})

	beforeEach(() => {
		jest.clearAllMocks()

		debugMock = jest.spyOn(core, 'debug').mockImplementation()
		getInputMock = jest.spyOn(core, 'getInput').mockImplementation((name: string) => inputs[name] || '')
		setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
	})

	afterEach(() => {
		// Restore @actions/github context
		setContext(originalContext)
	})

	afterAll(() => {
		// Restore
		jest.restoreAllMocks()
	})

	it('sets the comment id output', async () => {
		inputs = {
			'report-file': '__tests__/__fixtures__/report-valid.json',
			'comment-title': 'Custom comment title',
			'report-tag': 'Custom report tag'
		}

		const testContext: Context = {
			...github.context,
			eventName: 'pull_request',
			repo: {
				owner: 'some-owner',
				repo: 'some-repo'
			},
			issue: {
				owner: 'some-owner',
				repo: 'some-repo',
				number: 12345
			},
			payload: {
				issue: {
					number: 12345
				}
			}
		}
		setContext(testContext)

		await index.run()
		expect(runMock).toHaveReturned()

		// Verify that all of the core library functions were called correctly
		expect(debugMock).toHaveBeenCalledTimes(5)
		expect(debugMock).toHaveBeenNthCalledWith(1, 'Report file: __tests__/__fixtures__/report-valid.json')
		expect(debugMock).toHaveBeenNthCalledWith(2, 'Report url: ')
		expect(debugMock).toHaveBeenNthCalledWith(3, 'Report tag: Custom report tag')
		expect(debugMock).toHaveBeenNthCalledWith(4, 'Comment title: Custom comment title')
		expect(debugMock).toHaveBeenNthCalledWith(5, 'PR #12345 targeting undefined (undefined)')
	})

	it('sets a failed status', async () => {
		inputs = {
			'report-file': 'file-does-not-exist.json'
		}

		await index.run()
		expect(runMock).toHaveReturned()

		// Verify that all of the core library functions were called correctly
		expect(setFailedMock).toHaveBeenNthCalledWith(
			1,
			'Report file file-does-not-exist.json not found. Make sure Playwright is configured to generate a JSON report.'
		)
	})
})
