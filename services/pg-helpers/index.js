import express from 'express';
import {backup as model, admin} from '../models/index.js';
import config from '../lib/config.js';
import logger from '../lib/logger.js';

const app = express();

app.post('/backup', async (req, res) => {
  try {
    await model.backup(config.pgInstance.name, config.pgInstance.organization);
    res.status(200).send('Backup started');
  } catch (e) {
    logger.error('backup start failed', e);
    res.status(500).send('Backup started failed');
  }
});

app.post('/restore', async (req, res) => {
  try {
    model.restore(config.pgInstance.name, config.pgInstance.organization)
      .catch(e => logger.error('restore failed', e));
    res.status(200).send('Restore started');
  } catch (e) {
    logger.error('restore start failed', e);
    res.status(500).send('Restore started failed');
  }
});

app.post('/archive', async (req, res) => {
  try {
    model.archive(config.pgInstance.name, config.pgInstance.organization)
      .catch(e => logger.error('archive failed', e));
    res.status(200).send('archive started');
  } catch (e) {
    logger.error('archive start failed', e);
    res.status(500).send('archive started failed');
  }
});

app.post('/sync-users', async (req, res) => {
  try {
    let updatePassword = req.query['update-password'] === 'true';

    await admin.syncInstanceUsers(config.pgInstance.name, config.pgInstance.organization, updatePassword)
    res.status(200).send('syncd users');
  } catch (e) {
    logger.error('sync users failed', e);
    res.status(500).send('sync users failed');
  }
});

app.listen(3000, () => {
  logger.info('Backup service started on port 3000');
});