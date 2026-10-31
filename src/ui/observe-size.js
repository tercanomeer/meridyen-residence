// Öğenin yerleşim boyutu (CSS dönüşümlerinden etkilenmez; geçiş animasyonu sırasında da doğru ölçer).
export function layoutSize(element) {
  return { width: element.clientWidth, height: element.clientHeight };
}

// Öğenin boyutu gerçekten değişince (gecikmeli) geri çağırır. Bağlantıyı kesen fonksiyon döndürür.
export function observeSize(element, callback, delay = 150) {
  let timer = 0;
  const read = () => {
    const { width, height } = layoutSize(element);
    return `${width}x${height}`;
  };
  let last = read();

  const observer = new ResizeObserver(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const size = read();
      if (size === last) return;
      last = size;
      callback();
    }, delay);
  });
  observer.observe(element);

  return () => {
    observer.disconnect();
    window.clearTimeout(timer);
  };
}
