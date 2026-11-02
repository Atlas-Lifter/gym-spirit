# 외부 자료 출처 (Third-party notices)

GYM SPIRIT이 가져다 쓰는 외부 자료와 라이선스입니다.

## MuscleMap — 근육 지도 도형

- 출처: https://github.com/melihcolpan/MuscleMap (Melih Colpan)
- 라이선스: MIT
- 쓰는 곳: `src/data/bodyPaths.js` (남녀 앞·뒤 근육 도형. Swift 소스의 path 데이터를 모양을 바꾸지 않고 옮김)

```
MIT License

Copyright (c) 2026 Melih Colpan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## free-exercise-db — 운동 사진

- 출처: https://github.com/yuhonas/free-exercise-db
- 라이선스: The Unlicense (퍼블릭 도메인)
- 쓰는 곳: `public/exercises/*.jpg` (종목별 시작·끝 자세 사진)

## 식품영양성분 자료 — 식단 검색

- 출처: 식품의약품안전처 「통합식품영양성분정보」(음식), 농촌진흥청 「국가표준식품성분표」(원재료성 식품) — 공공데이터포털(data.go.kr)
- 이용 조건: 공공데이터포털 표기 '이용허락범위 제한 없음'
- 쓰는 곳: `public/data/kfood.json` (`.tools/kfood_build.py` 로 이름·브랜드·열량·단백질·탄수화물·지방·1회 제공량만 추려 만듦)
- 업체가 공개하지 않은 탄수화물·지방은 비워 두고 앱에서 '정보 없음'으로 표시함
