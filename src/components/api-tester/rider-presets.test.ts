import { describe, expect, it } from 'vitest'
import { API_PRESETS } from './api-presets'
import { RIDER_PRESETS } from './rider-presets'
import { presetsFromSchema } from '../../services/api-schema-service'

describe('Rider API Studio workflow', () => {
  it('keeps authenticated shift, job, delivery, issue, return and receipt operations testable', () => {
    const ids = new Set(RIDER_PRESETS.map((preset) => preset.id))
    for (const action of ['accept', 'pickup', 'arrive', 'complete', 'collect-cash', 'confirm-return']) expect(ids.has(`rider-${action}`)).toBe(true)
    for (const preset of RIDER_PRESETS) { expect(preset.auth).toBe('session'); expect(API_PRESETS).toContainEqual(preset) }
    expect(JSON.parse(RIDER_PRESETS.find((preset) => preset.id === 'rider-issue')!.body!)).toHaveProperty('note')
    expect(RIDER_PRESETS.find((preset) => preset.id === 'rider-ops-return')?.url).toContain('/orders/{orderId}/delivery/request-return/')
  })

  it('discovers rider job IDs as orderId and preserves live request properties', () => {
    const operations = presetsFromSchema({ paths: { '/api/v1/rider/jobs/{id}/report-issue/': { post: {
      security: [{ jwtAuth: [] }], requestBody: { content: { 'application/json': { schema: { required: ['code', 'note'], properties: { code: { type: 'string' }, note: { type: 'string' } } } } } },
    } } } }, RIDER_PRESETS)
    const issue = operations.find((preset) => preset.id === 'rider-issue')!
    expect(issue.resource).toBe('order')
    expect(issue.fields).toEqual(['code *', 'note *'])
    expect(operations.filter((preset) => preset.url.endsWith('/rider/jobs/{orderId}/report-issue/'))).toHaveLength(1)
  })
})
