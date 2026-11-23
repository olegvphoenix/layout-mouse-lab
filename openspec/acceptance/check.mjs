import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';

async function check(path) {
  if (!path) throw new Error('Укажите путь к JSON с наблюдениями проверяемого редактора.');
  const fixture = JSON.parse(await readFile(new URL('./gesture-vectors.json', import.meta.url), 'utf8'));
  const report = JSON.parse(await readFile(path, 'utf8'));
  if (report.version !== fixture.version || !report.observations) throw new Error('Неизвестный формат наблюдений.');
  let compared = 0;
  let failed = 0;
  for (const scenario of fixture.cases) {
    const steps = report.observations[scenario.id];
    if (!Array.isArray(steps) || steps.length !== scenario.steps.length) {
      console.error(scenario.id, 'ожидается шагов', scenario.steps.length, 'получено', steps?.length ?? 0);
      failed++;
      continue;
    }
    scenario.steps.forEach(([event, , expected], i) => {
      for (const [key, value] of Object.entries(expected)) {
        compared++;
        const actual = steps[i]?.[key];
        if (isDeepStrictEqual(actual, value)) continue;
        failed++;
        console.error(scenario.id, 'шаг', i + 1, event, key, 'ожидалось', JSON.stringify(value), 'получено', JSON.stringify(actual));
      }
    });
  }
  console.log('Траекторий:', fixture.cases.length, 'сравнений:', compared, 'расхождений:', failed);
  if (failed) process.exitCode = 1;
}

try {
  await check(process.argv[2]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
