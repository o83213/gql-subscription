import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { createServer } from "http";
import express from "express";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import cors from "cors";
import { PubSub } from "graphql-subscriptions";

const messages = [];
const PORT = 4000;
const pubsub = new PubSub();

const typeDefs = `#graphql
  type Message {
    id: ID!
    user: String!
    content: String!
  }
  type Query {
    messages: [Message!]!
  }
  type Mutation {
    postMessage(user: String!, content: String!): ID!
  }
  type Subscription {
    messages: [Message!]!
  }
`;

const subscribers = [];
const onMessagesUpdates = (fn) => subscribers.push(fn);

const resolvers = {
  Subscription: {
    messages: {
      subscribe: () => {
        const channel = Math.random().toString(36).slice(2, 15);
        // put the new cliet into subscribers list
        onMessagesUpdates(() => pubsub.publish(channel, { messages }));
        // for the first time, we want to send the messages to the subscribe client
        setTimeout(() => pubsub.publish(channel, { messages }), 0);
        return pubsub.asyncIterator(channel);
      },
    },
  },
  Query: {
    messages: () => messages,
  },
  Mutation: {
    postMessage: (parent, { user, content }, context) => {
      const id = messages.length;
      const newMessage = {
        id,
        user,
        content,
      };
      messages.push(newMessage);
      subscribers.forEach((fn) => fn());
      return id;
    },
  },
};
async function main() {
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const app = express();
  const httpServer = createServer(app);

  // Create our WebSocket server using the HTTP server we just set up.
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });
  // Save the returned server's info so we can shutdown this server later
  const serverCleanup = useServer({ schema }, wsServer);

  // Set up ApolloServer.
  const server = new ApolloServer({
    schema,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();
  app.use("/graphql", cors(), express.json(), expressMiddleware(server));

  // Now that our HTTP server is fully set up, we can listen to it.
  httpServer.listen(PORT, () => {
    console.log(`Server is now running on http://localhost:${PORT}/graphql`);
  });
}

main().catch(async (err) => {
  console.log(err.message);
});
