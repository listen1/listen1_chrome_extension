export function parseLyric(lyric, tlyric) {
  const lines = lyric.split('\n');
  let result = [];
  const timeResult = [];

  if (typeof tlyric !== 'string') {
    tlyric = '';
  }
  const linesTrans = tlyric.split('\n');
  const resultTrans = [];
  const timeResultTrans = [];
  if (tlyric === '') {
    linesTrans.splice(0);
  }

  const process = (result, timeResult, translationFlag) => (line, index) => {
    const tagReg = /\[\D*:([^\]]+)\]/g;
    const tagRegResult = tagReg.exec(line);
    if (tagRegResult) {
      const lyricObject = {};
      lyricObject.seconds = 0;
      [lyricObject.content] = tagRegResult;
      result.push(lyricObject);
      return;
    }

    const timeReg = /\[(\d{2,})\:(\d{2})(?:\.(\d{1,3}))?\]/g; // eslint-disable-line no-useless-escape

    let timeRegResult = null;
    // eslint-disable-next-line no-cond-assign
    while ((timeRegResult = timeReg.exec(line)) !== null) {
      const htmlUnescapes = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'"
      };
      timeResult.push({
        content: line.replace(timeRegResult[0], '').replace(/&(?:amp|lt|gt|quot|#39|apos);/g, (match) => htmlUnescapes[match]),
        seconds:
          parseInt(timeRegResult[1], 10) * 60 * 1000 + // min
          parseInt(timeRegResult[2], 10) * 1000 + // sec
          (timeRegResult[3] ? parseInt(timeRegResult[3].padEnd(3, '0'), 10) : 0), // microsec
        translationFlag,
        index
      });
    }
  };

  lines.forEach(process(result, timeResult, false));
  linesTrans.forEach(process(resultTrans, timeResultTrans, true));

  // sort time line
  result = timeResult.concat(timeResultTrans).sort((a, b) => {
    const keyA = a.seconds;
    const keyB = b.seconds;

    // Compare the 2 dates
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    if (a.translationFlag !== b.translationFlag) {
      if (a.translationFlag === false) {
        return -1;
      }
      return 1;
    }
    if (a.index < b.index) return -1;
    if (a.index > b.index) return 1;
    return 0;
  });
  // disable tag info, because music provider always write
  // tag info in lyric timeline.
  // result.push.apply(result, timeResult);
  // result = timeResult; // executed up there

  for (let i = 0; i < result.length; i += 1) {
    result[i].lineNumber = i;
  }

  return result;
}

export function calculateLine(currentSeconds, lyricArray, lyricLineNumber, lyricLineNumberTrans, lastIndex) {
  let lastObject = null;
  let lastObjectTrans = null;
  let index = lastIndex;
  for (let i = lastIndex + 1; i < lyricArray.length; i++) {
    const lyric = lyricArray[i];
    if (currentSeconds >= lyric.seconds / 1000) {
      index = i;
      if (!lyric.translationFlag) {
        lastObject = lyric;
      } else {
        lastObjectTrans = lyric;
      }
    } else {
      break;
    }
    i++;
  }
  let newLineNumber = lyricLineNumber;
  let newTransLineNumber = lyricLineNumberTrans;
  if (lastObject && lastObject.lineNumber !== lyricLineNumber) {
    newLineNumber = lastObject.lineNumber;
    if (lastObjectTrans && lastObjectTrans.lineNumber !== lyricLineNumberTrans) {
      newTransLineNumber = lastObjectTrans.lineNumber;
    }
  }
  return { lineNumber: newLineNumber, transLineNumber: newTransLineNumber, index };
}
