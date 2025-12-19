import I18n from './I18n';

let instance: I18n | null = null;

export function getI18n(): I18n {
  if (!instance) {
    instance = new I18n(process.env.LANG || 'ja');
  }
  return instance;
}

export default getI18n();
