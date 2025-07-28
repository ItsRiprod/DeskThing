import { storeProvider } from '@server/stores/storeProvider'
import { GithubRepository } from '@shared/types'

export const fetchRepoSummary = async (repoUrl: string): Promise<GithubRepository> => {
  const githubStore = await storeProvider.getStore('githubStore')

  const summary = await githubStore.getRepository(repoUrl)

  if (summary) return summary

  throw new Error('Repository not found')
}
