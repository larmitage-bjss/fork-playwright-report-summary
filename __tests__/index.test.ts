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
const debugMock = jest.spyOn(core, 'debug').mockImplementation(jest.fn())
//const infoMock = jest.spyOn(core, 'info').mockImplementation(jest.fn())
//const warningMock = jest.spyOn(core, 'warning').mockImplementation(jest.fn())
//const errorMock = jest.spyOn(core, 'error').mockImplementation(jest.fn())
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getInputMock = jest.spyOn(core, 'getInput').mockImplementation((name: string) => inputs[name] || '')
const setFailedMock = jest.spyOn(core, 'setFailed')
const setOutputMock = jest.spyOn(core, 'setOutput')

// Mock the GitHub Actions context library
// const getOctokitMock = jest.spyOn(github, 'getOctokit')
// const contextMock = jest.spyOn(github, 'context')

// Mock the action's entrypoint
const runMock = jest.spyOn(index, 'run')

// Mark as GitHub action environment
// process.env.GITHUB_ACTIONS = 'true'

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
			'comment-title': 'Custom comment title'
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
		expect(debugMock).toHaveBeenNthCalledWith(1, 'Report file: __tests__/__fixtures__/report-valid.json')
		expect(debugMock).toHaveBeenNthCalledWith(2, 'Comment title: Custom comment title')
		expect(setOutputMock).toHaveBeenNthCalledWith(1, 'comment-id', expect.anything())
	})

	it('sets a failed status', async () => {
		inputs = {
			'report-file': 'file-does-not-exist.json'
		}

		await index.run()
		expect(runMock).toHaveReturned()

		// Verify that all of the core library functions were called correctly
		expect(setFailedMock).toHaveBeenNthCalledWith(1, 'Failed to find report file at path file-does-not-exist.json')
	})
})
