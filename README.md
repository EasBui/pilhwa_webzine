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

## Custom Domain

현재 배포 방식은 `custom GitHub Actions workflow`이므로, 커스텀 도메인 연결의 기준은 루트의 `CNAME` 파일이 아니라 GitHub의 `Settings > Pages > Custom domain` 설정입니다.

`pilhwa.me`를 연결하려면 아래 순서로 설정합니다.

1. GitHub 저장소 `Settings > Pages`에서 `Custom domain`에 `pilhwa.me`를 입력하고 저장합니다.
2. 도메인 구매처 DNS 관리 화면에서 apex(`@`)에 아래 `A` 레코드 4개를 추가합니다.

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

3. 가능하면 IPv6용 `AAAA` 레코드도 함께 추가합니다.

```text
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

4. `www.pilhwa.me`도 같이 쓰려면 `CNAME` 레코드를 추가합니다.

```text
Host: www
Value: easbui.github.io
```

5. DNS 전파 후 GitHub `Pages` 설정에서 `Enforce HTTPS`를 켭니다.

GitHub Pages는 apex 도메인과 `www`를 함께 설정하면 자동 리다이렉트를 지원합니다. 즉 `pilhwa.me`를 커스텀 도메인으로 저장하면 `www.pilhwa.me`는 `pilhwa.me`로 리다이렉트되도록 둘 수 있습니다.

## Notes

- 이 저장소의 현재 배포 방식에서는 기존 `CNAME` 파일이 자동 생성되지 않으며, 저장소에 수동으로 추가해도 GitHub Pages 설정값이 기준이 됩니다.
- 가입신청 링크는 `https://forms.gle/VjEBUtseMVTgzyPb6`를 사용합니다.
