import './style.scss';

import { Game } from './game';

type Metric = {
  timeInterval?: number;
  timeElapsed?: number;
  correct?: boolean;
  stepInSequence?: number;
  sequenceLength?: number;
  clickCounter?: number;
  totalTimeElapsed?: number;
};

const maxRounds = 5;
let metric: Metric[] = [];
let counter = 0;

let lastTime = 0;
let timeNow = 0;
let startTime = 0;
let level = 1;

const appDiv = document.getElementById('app') as HTMLElement;
const game = new Game(appDiv, {
  onClick: (
    timeStamp: number,
    currentLevel: number,
    currentStep: number,
    correct: boolean
  ) => {
    timeNow = timeStamp;
    if (!lastTime) {
      startTime = lastTime = timeStamp;
    }

    metric.push({
      timeInterval: timeNow - lastTime,
      timeElapsed: timeNow - startTime,
      correct: correct,
      stepInSequence: currentStep,
      sequenceLength: currentLevel,
      clickCounter: counter++,
    });
    lastTime = timeNow;
  },
  onFinishRound: (won: boolean) => {
    metric.push({
      totalTimeElapsed: timeNow - startTime,
    });
    startTime = lastTime = timeNow = 0;

    if (won) level += 1;

    if (level >= maxRounds) {
      renderMetric(metric);
      console.table(metric);
    } else game.start(level);
  },
});

const renderMetric = (m: Metric[]) => {
  const renderColumns = () => `<tr>
      <th>Clicks</th>
      <th>Correct</th>
      <th>Step in se</th>
      <th>Seq length</th>
      <th>Elapsed</th>
      <th>Interval</th>
      <th>Total Elapsed</th>
    </tr>`;

  const renderRow = (r: Metric) => `<tr>
      <td>${r.clickCounter ?? '-'}</td>
      <td>${
        r.correct === undefined ? '-' : r.correct === true ? 'Yes' : 'No'
      }</td>
      <td>${r.stepInSequence ?? '-'}</td>  
      <td>${r.sequenceLength ?? '-'}</td>
      <td>${r.timeElapsed ?? '-'}</td>
      <td>${r.timeInterval ?? '-'}</td>
      <td>${r.totalTimeElapsed ?? '-'}</td>  
    </tr>`;

  const table = document.createElement('table');

  table.innerHTML = `<table>
      <thead>${renderColumns()}</thead>
      <tbody>${metric.map(renderRow).join('')}</tbody>
    </table>`;

  appDiv.append(table);
};

game.start(level);
