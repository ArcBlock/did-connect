export const localeProp = {
  type: String,
  default: 'en',
  validator: (v) => ['en', 'zh'].includes(v),
};

export const connectLayoutProp = {
  type: String,
  validator: (v) => ['lr', 'tb'].includes(v),
  required: true,
};
