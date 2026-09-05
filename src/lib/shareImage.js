// 일정을 "사진 한 장"으로 만들어 카톡 등으로 공유하는 기능의 실제 캡처/공유 로직.
// html2canvas는 이 기능을 쓸 때만 필요하므로 동적 import — 초기 번들 크기에 영향 없게.
export async function captureNodeAsBlob(node) {
  const { default: html2canvas } = await import("html2canvas");
  // 카드 안 폰트(세리프)가 아직 로드 중이면 캡처 시점에 기본 폰트로 그려질 수 있어 먼저 기다린다.
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* 폰트 로딩 API 미지원 브라우저는 그냥 진행 */ }
  }
  const canvas = await html2canvas(node, {
    scale: 2, // 레티나 화면에서도 흐릿하지 않게
    backgroundColor: "#ffffff",
    useCORS: true,
  });
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

// 기기가 사진 파일 공유를 지원하면(대부분 모바일 브라우저) 카카오톡 등으로 바로 보내는 공유창을 띄우고,
// 아니면(대부분 데스크톱) 그냥 PNG로 다운로드해서 사용자가 직접 보내게 한다.
export async function shareOrDownloadImage(blob, filename, { title, text } = {}) {
  const file = new File([blob], filename, { type: "image/png" });

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text });
      return "shared";
    } catch (e) {
      if (e?.name === "AbortError") return "cancelled"; // 사용자가 공유창을 취소함 — 에러 아님
      // 공유 자체가 실패하면 다운로드로 폴백
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return "downloaded";
}
