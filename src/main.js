/* eslint-disable no-return-await */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
import { addDays, format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { readFileSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';
import {
  applySpec,
  concat,
  drop,
  match,
  pipe,
  prop,
  reduce,
} from 'ramda';

import log from './log';

// Constants
const START_DATE = new Date('01/01/2019');
const AMOUNT_REQUESTS = 1100;

const URL_MOON_PHASES = 'https://www.moongiant.com/phase';
const STATUS_OK = 200;

// Utils to format data
const concatNumber = reduce(concat, '');
const scrapMoonPhase = pipe(match(/Phase: <span>(.+)<\\\/span>/), prop(1));
const scrapIllumination = pipe(
  match(/Illumination: <span>(\d{1,2})%/),
  prop(1),
);
const scrapMoonDistance = pipe(
  match(/Moon Distance: <span>((?:\d+\.?)+,?)<\\\/span>((?:\d+\.?)+)/),
  drop(1),
  concatNumber,
);
const scrapMoonAngle = pipe(match(/Moon Angle: <span>((?:\d+\.?)+)/), prop(1));
const scrapMoonAge = pipe(match(/Moon Age: <span>((?:\d+\.?)+)/), prop(1));
const scrapSunAngle = pipe(match(/Sun Angle: <span>((?:\d+\.?)+)/), prop(1));
const scrapSunDistance = pipe(
  match(
    /Sun Distance: <span>((?:\d+\.?)+,?)<\\\/span>((?:\d+\.?)+,?)<\\\/span>((?:\d+\.?)+)/,
  ),
  drop(1),
  concatNumber,
);
const scrapSun = applySpec({
  angle: scrapSunAngle,
  distance: scrapSunDistance,
});

// Scran moon phase data from body response.
const scrapMoonData = pipe(
  match(/jArray=(.*)/),
  prop(1),
  applySpec({
    distance: scrapMoonDistance,
    phase: scrapMoonPhase,
    illumination: scrapIllumination,
    age: scrapMoonAge,
    angle: scrapMoonAngle,
    sun: scrapSun,
  }),
);

/**
 *
 */
const fetchDate = async (date) => {
  const formatedDate = format(date, 'P', { locale: enUS });
  const data = await fetch(`${URL_MOON_PHASES}/${formatedDate}`);
  if (data.status === STATUS_OK) {
    const scrapedData = await data.text();
    const moonData = scrapMoonData(scrapedData);

    log.info(date, 'Success request');
    return { date, ...moonData };
  }
  log.error(date, 'Failed request');

  return null;
};

// Get storaged data file
const getDataFile = () => {
  try {
    const data = readFileSync('data.json');
    return JSON.parse(data);
  } catch (_) {
    return null;
  }
};

/**
 * Retrieve moon phases data starting to a initial date.
 *
 * @param {Object} options
 * @param { Date } options.startDate - Start date to retrieve from origin
 * @param { Number } options.amountRequest - Days amount to retrieve in the same fetch
 */
const main = async ({ startDate = new Date(), amountRequests = 1 }) => {
  const output = getDataFile() || {};
  const datesToFetch = new Array(
    ...new Array(amountRequests).keys(),
  ).map((idx) => addDays(startDate, idx));

  const newData = await Promise.all(
    datesToFetch.map(async (date) => {
      const data = await fetchDate(date);
      if (data) {
        return data;
      }
      datesToFetch.push(date);
      return null;
    }),
  );

  newData.forEach(({ date, ...restDate }) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    if (!output[year]) {
      output[year] = {};
    }

    if (!output[year][month]) {
      output[year][month] = {};
    }

    output[year][month][day] = restDate;
  }, {});

  writeFileSync('data.json', JSON.stringify(output));
};

main({
  startDate: START_DATE,
  amountRequests: AMOUNT_REQUESTS,
});
