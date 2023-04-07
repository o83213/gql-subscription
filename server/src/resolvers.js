export const resolvers = {
  Query: {
    messages: () => messages,
  },
  Mutation: {
    postMessage: (parent, { user, content }, context) => {
      const newMessage = {
        id: messages.length - 1,
        user,
        content,
      };
      messages.push(newMessage);
      return newMessage;
    },
  },
};
