import russianAwards from './awards.js';
import russianRanks from './ranks.js';
import russianMonths from './months.js';

describe('Распознавание', () => {
  it('Награды Российской Федерации', () => {
    const awards = Object.values(russianAwards).filter(award => award.regexp);
    awards.forEach(award => {
      const names = [award.name, ...(award.testRegexp ? award.testRegexp.split(/, /gi) : [])];
      names.forEach(name => {
        if (!name.match(new RegExp(award.regexp, 'gi'))) {
          console.log(name, new RegExp(award.regexp, 'gi'));
        }
        expect(name.match(new RegExp(award.regexp, 'gi'))).toBeTruthy();
      });
    });
  });

  it('Звания Российской Федерации', () => {
    const titles = Object.values(russianRanks).filter(title => title.regexp);
    titles.forEach(title => {
      const names = [title.name, ...(title.testRegexp ? title.testRegexp.split(/, /gi) : [])];
      names.forEach(name => {
        if (!name.match(title.regexp)) {
          console.log(name, title.regexp);
        }
        expect(name.match(title.regexp)).toBeTruthy();
      });
    });
  });

  it('Месяцы', () => {
    const months = Object.values(russianMonths).filter(month => month.regexp);
    months.forEach(month => {
      const names = [month.name, ...(month.testRegexp ? month.testRegexp.split(/, /gi) : [])];
      names.forEach(name => {
        if (!name.match(month.regexp)) {
          console.log(name, month.regexp);
        }
        expect(name.match(month.regexp)).toBeTruthy();
      });
    });
  });
});