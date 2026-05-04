

export function sortResponses(a, b) {
  if (a.timestamp == b.timestamp) {
    if (b.name == 'upload') {
      return -1
    }
  }

  return a.timestamp.localeCompare(b.timestamp)
}

