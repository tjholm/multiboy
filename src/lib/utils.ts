export function fileToArrayBuffer(file) {
  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = () => resolve(fileReader.result);

    fileReader.onerror = () => {
      fileReader.abort();
      reject(new Error("Error parsing file"));
    };

    fileReader.readAsArrayBuffer(file);
  });
}

export const shuffle = <T>(array: T[]): T[] => {
  const copy = [...array];

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }

  return copy;
}