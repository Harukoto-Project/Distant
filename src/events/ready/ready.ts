import { Event } from '../../lib/modules/Event';
import { getI18n } from '../../lib/modules/i18nInstance';

export default new Event('ready', (client) => {
  const i18n = getI18n();
  console.log(i18n.t('ready.logged_in', { tag: client.user?.tag ?? '' }));
});
