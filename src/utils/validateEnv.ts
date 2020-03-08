import {
    cleanEnv, str
  } from 'envalid';
   
  export function validateEnv() {
    cleanEnv(process.env, {
      MONGO_PASSWORD: str(),
      MONGO_PATH: str(),
      MONGO_USER: str(),
      JWT_SECRET: str()
    });
  }