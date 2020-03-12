import {
    cleanEnv, str
  } from 'envalid';
   
  export function validateEnv() {
    cleanEnv(process.env, {
      MONGODB_URL: str(),
      JWT_SECRET: str()
    });
  }