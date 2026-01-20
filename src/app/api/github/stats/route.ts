import { NextResponse } from "next/server";
import type { GitHubRepo } from "@/types/github";

export async function GET() {
  const username =
    process.env.GITHUB_USERNAME || process.env.NEXT_PUBLIC_GITHUB_USERNAME;

  if (!username) {
    return NextResponse.json(
      { error: "GitHub username not configured" },
      { status: 500 },
    );
  }

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        next: { revalidate: 3600 },
      }),
      fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
        { next: { revalidate: 3600 } },
      ),
    ]);

    if (!userRes.ok || !reposRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch GitHub data" },
        { status: 500 },
      );
    }

    const userData = await userRes.json();
    const reposData: GitHubRepo[] = await reposRes.json();

    const totalStars = reposData.reduce(
      (acc: number, repo: GitHubRepo) => acc + (repo.stargazers_count || 0),
      0,
    );
    const topRepo = reposData.sort(
      (a: GitHubRepo, b: GitHubRepo) => b.stargazers_count - a.stargazers_count,
    )[0];

    return NextResponse.json({
      ...userData,
      total_stars: totalStars,
      top_repo: topRepo
        ? {
            name: topRepo.name,
            stars: topRepo.stargazers_count,
            language: topRepo.language,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
