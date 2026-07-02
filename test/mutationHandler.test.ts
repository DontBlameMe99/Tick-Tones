import { beforeEach, describe, expect, it, jest } from 'bun:test'
import { handleCheckboxMutation } from 'src/mutationHandler'

function checkboxEl(checked: boolean): HTMLElement {
  return {
    checked,
    classList: { contains: jest.fn().mockReturnValue(true) },
    querySelector: jest.fn(),
  } as unknown as HTMLElement
}

function parentEl(child: HTMLElement | null): HTMLElement {
  return {
    classList: { contains: jest.fn().mockReturnValue(false) },
    querySelector: jest.fn().mockReturnValue(child),
  } as unknown as HTMLElement
}

function mutation(target: HTMLElement, oldValue: string | null): MutationRecord {
  return { type: 'attributes', target, oldValue } as unknown as MutationRecord
}

describe('handleCheckboxMutation', () => {
  let onCheck: jest.Mock
  let onUncheck: jest.Mock

  beforeEach(() => {
    onCheck = jest.fn()
    onUncheck = jest.fn()
  })

  it('calls onCheck when checkbox transitions unchecked → checked', () => {
    const el = checkboxEl(true)
    handleCheckboxMutation([mutation(el, null)], onCheck, onUncheck)
    expect(onCheck).toHaveBeenCalledTimes(1)
    expect(onUncheck).not.toHaveBeenCalled()
  })

  it('calls onUncheck when checkbox transitions checked → unchecked', () => {
    const el = checkboxEl(false)
    handleCheckboxMutation([mutation(el, 'x')], onCheck, onUncheck)
    expect(onUncheck).toHaveBeenCalledTimes(1)
    expect(onCheck).not.toHaveBeenCalled()
  })

  it('skips when already checked (no transition)', () => {
    const el = checkboxEl(true)
    handleCheckboxMutation([mutation(el, 'x')], onCheck, onUncheck)
    expect(onCheck).not.toHaveBeenCalled()
    expect(onUncheck).not.toHaveBeenCalled()
  })

  it('skips when already unchecked (no transition)', () => {
    const el = checkboxEl(false)
    handleCheckboxMutation([mutation(el, null)], onCheck, onUncheck)
    expect(onCheck).not.toHaveBeenCalled()
    expect(onUncheck).not.toHaveBeenCalled()
  })

  it('skips non-attribute mutations', () => {
    const el = checkboxEl(true)
    const m = { type: 'childList', target: el } as unknown as MutationRecord
    handleCheckboxMutation([m], onCheck, onUncheck)
    expect(onCheck).not.toHaveBeenCalled()
    expect(onUncheck).not.toHaveBeenCalled()
  })

  it('ignores elements without the checkbox class and no matching child', () => {
    const el = parentEl(null)
    handleCheckboxMutation([mutation(el, null)], onCheck, onUncheck)
    expect(onCheck).not.toHaveBeenCalled()
    expect(onUncheck).not.toHaveBeenCalled()
  })

  it('deduplicates same checkbox appearing twice in one batch', () => {
    const el = checkboxEl(true)
    handleCheckboxMutation([mutation(el, null), mutation(el, null)], onCheck, onUncheck)
    expect(onCheck).toHaveBeenCalledTimes(1)
  })

  it('deduplicates when checkbox is both direct target and querySelector result', () => {
    const shared = checkboxEl(true)
    const parent = parentEl(shared)
    handleCheckboxMutation([mutation(parent, null), mutation(shared, null)], onCheck, onUncheck)
    expect(onCheck).toHaveBeenCalledTimes(1)
  })

  it('falls back to querySelector for parent elements', () => {
    const child = checkboxEl(true)
    const parent = parentEl(child)
    handleCheckboxMutation([mutation(parent, null)], onCheck, onUncheck)
    expect(onCheck).toHaveBeenCalledTimes(1)
    expect(onUncheck).not.toHaveBeenCalled()
  })

  it('handles mixed check and uncheck in one batch', () => {
    const a = checkboxEl(true)
    const b = checkboxEl(false)
    handleCheckboxMutation([mutation(a, null), mutation(b, 'x')], onCheck, onUncheck)
    expect(onCheck).toHaveBeenCalledTimes(1)
    expect(onUncheck).toHaveBeenCalledTimes(1)
  })

  it('processes non-task elements in a batch without error', () => {
    const task = checkboxEl(true)
    const nonTask = parentEl(null)
    handleCheckboxMutation([mutation(nonTask, null), mutation(task, null)], onCheck, onUncheck)
    expect(onCheck).toHaveBeenCalledTimes(1)
  })

  it('returns without calling anything for empty mutations array', () => {
    handleCheckboxMutation([], onCheck, onUncheck)
    expect(onCheck).not.toHaveBeenCalled()
    expect(onUncheck).not.toHaveBeenCalled()
  })
})
