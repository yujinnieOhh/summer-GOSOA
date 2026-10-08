// 비공식 고지 + 연락처(카카오톡 오픈채팅) 푸터.
// 링크는 target="_blank" 미사용 — 인앱 브라우저(카톡 등)가 _blank를 무시해
// dead-click이 되는 걸 피하려 같은 탭 이동으로 둔다(하이라이트 버튼과 동일한 이유).

const KAKAO_OPENCHAT_URL = "https://open.kakao.com/o/shHL4ivi";

export default function Footer() {
  return (
    <footer className="border-t border-sono-navy/10 px-6 py-8 text-center text-xs leading-relaxed text-sono-navy/55">
      <p className="mx-auto max-w-md">
        이 사이트는 팬이 만든 비공식 서비스로, 고양 소노 스카이거너스 구단 및
        KBL과 관련이 없습니다. 경기 정보의 저작권은 KBL에 있습니다.
      </p>
      <p className="mt-3">
        문의 · 건의 · 오류 제보{" "}
        <a
          href={KAKAO_OPENCHAT_URL}
          className="font-medium text-sono-navy/80 underline underline-offset-2 transition-colors hover:text-sono-navy"
        >
          카카오톡 오픈채팅
        </a>
      </p>
    </footer>
  );
}
