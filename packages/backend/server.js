/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-07-20 02:24:58
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-07-20 02:32:43
 * @FilePath: \city_collect\packages\backend\server.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const fastify = require('fastify')({ logger: true });
const mongoose = require('mongoose');
const cors = require('@fastify/cors');
const darenRoutes = require('./routes/daren');
const periodRoutes = require('./routes/periods');
const cookieRoutes = require('./routes/cookies');
const settingsRoutes = require('./routes/settings');

// TODO: Replace with your MongoDB connection string
const mongoConnectionString = 'mongodb://47.121.31.68:32233/city_collect';

mongoose.connect(mongoConnectionString, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

fastify.register(cors, {
  origin: '*', // In production, you should restrict this to your frontend's domain
});

fastify.register(darenRoutes);
fastify.register(periodRoutes);
fastify.register(cookieRoutes);
fastify.register(settingsRoutes);

fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3005 });
    console.log('🚀 服务器启动成功，端口: 3005');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 