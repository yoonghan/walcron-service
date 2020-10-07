export const mockResponseApi = () => {
  let persistedMessage;

  return {
    json: (message:any) => {persistedMessage = message},
    getJson: () => persistedMessage
  }
};
