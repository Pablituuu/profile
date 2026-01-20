export interface GitHubRepo {
  name: string;
  stargazers_count: number;
  language: string | null;
}

export interface GitHubStats {
  public_repos: number;
  total_stars: number;
  followers: number;
  top_repo: {
    name: string;
    stars: number;
    language: string | null;
  } | null;
}
