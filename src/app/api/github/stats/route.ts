import { NextResponse } from "next/server";

export async function GET() {
  const username = process.env.GITHUB_USERNAME;

  if (!username) {
    return NextResponse.json(
      { error: "GitHub username not configured" },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch GitHub data" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
