import { afterEach, beforeAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
  if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:category-preview-test'
  if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {}
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  vi.unstubAllGlobals()
})
