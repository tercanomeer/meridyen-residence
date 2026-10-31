// Öğenin boyutu gerçekten değişince (gecikmeli) geri çağırır. Bağlantıyı kesen fonksiyon döndürür.

export function observeSize(element, callback, delay = 150) {
  let last = '';
  let timer = 0;
  const read = () => {
    const { width, height } = element.getBoundingClientRect();
    return `${Math.round(width)}x${Math.round(height)}`;
  };
  last = read();

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
