export function handleCheckboxMutation(
  mutations: MutationRecord[],
  onCheck: () => void,
  onUncheck: () => void
): void {
  const processed = new Set<Element>()
  for (const mutation of mutations) {
    if (mutation.type !== 'attributes') continue
    const el = mutation.target as HTMLElement

    const checkbox: HTMLInputElement | null = el.classList.contains('task-list-item-checkbox')
      ? (el as HTMLInputElement)
      : el.querySelector<HTMLInputElement>('.task-list-item-checkbox')

    if (!checkbox || processed.has(checkbox)) continue
    processed.add(checkbox)

    if (checkbox.checked && mutation.oldValue !== 'x') {
      onCheck()
    } else if (!checkbox.checked && mutation.oldValue === 'x') {
      onUncheck()
    }
  }
}
