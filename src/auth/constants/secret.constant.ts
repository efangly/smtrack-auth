
export const jwtConstants = {
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  expire: process.env.EXPIRE_TIME,
  refreshExpire: process.env.REFRESH_EXPIRE_TIME
};