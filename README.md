# pilhwa_webzine

서울대 언론비평동아리 필화의 정적 홈페이지입니다.

## Files

- `index.html`: 메인 페이지
- `join.html`: 가입신청 폼으로 리다이렉트하는 페이지
- `styles.css`: 공용 스타일

## GitHub Pages 배포

이 저장소는 GitHub Actions로 GitHub Pages에 배포되도록 구성되어 있습니다.

1. GitHub에서 새 저장소를 만듭니다.
2. 아래 명령으로 원격 저장소를 연결하고 push합니다.

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git add .
git commit -m "Initial site"
git push -u origin main
```

3. GitHub 저장소의 `Settings > Pages`에서 `Build and deployment`를 `GitHub Actions`로 설정합니다.
4. 첫 배포가 끝나면 `https://<username>.github.io/<repo>/` 또는 사용자/조직 페이지 설정에 맞는 주소로 접속합니다.

## Notes

- 커스텀 도메인을 쓸 경우 `CNAME` 파일을 루트에 추가하면 됩니다.
- 가입신청 링크는 `https://forms.gle/VjEBUtseMVTgzyPb6`를 사용합니다.
