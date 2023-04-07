import { gql, useQuery, useMutation, useSubscription } from "@apollo/client";
import { useRef, useState } from "react";

const GET_MESSAGES = gql`
  query {
    messages {
      id
      user
      content
    }
  }
`;

const SUBSCRIBE_MESSAGES = gql`
  subscription {
    messages {
      id
      user
      content
    }
  }
`;

const POST_MESSAGE = gql`
  mutation PostMessage($user: String!, $content: String!) {
    postMessage(user: $user, content: $content)
  }
`;

const Messages = ({ user }: { user: string }) => {
  const { data } = useSubscription(SUBSCRIBE_MESSAGES);
  // const { data, loading } = useQuery(GET_MESSAGES);
  if (!data) {
    return <div>There is no message</div>;
  }
  console.log("data", data);
  return (
    <div>
      {data.messages.map(({ id, user: messageUser, content }: any) => (
        <div
          key={id}
          style={{
            display: "flex",
            justifyContent: user === messageUser ? "flex-end" : "flex-start",
            paddingBottom: "1em",
          }}
        >
          {user !== messageUser && (
            <div
              style={{
                height: 50,
                width: 50,
                marginRight: "0.5em",
                border: "2px solid #e5e6ea",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18pt",
              }}
            >
              <div>{messageUser.slice(0, 2).toUpperCase()}</div>
            </div>
          )}
          <div
            style={{
              background: user === messageUser ? "#58bf56" : "#e5e6ea",
              color: user === messageUser ? "white" : "black",
              padding: "1em",
              borderRadius: "1em",
              maxWidth: "60%",
            }}
          >
            {content}
          </div>
        </div>
      ))}
    </div>
  );
};

function Chat() {
  const [user, setUser] = useState("");
  const textRef = useRef<HTMLInputElement>(null);
  //
  const [postMessage] = useMutation(POST_MESSAGE);
  //
  const onSend = () => {
    if (!textRef || !textRef.current) {
      return;
    }
    if (textRef.current.value.trim() !== "") {
      postMessage({
        variables: {
          user: user,
          content: textRef.current.value,
        },
        refetchQueries: [{ query: GET_MESSAGES }],
      });
    }
    textRef.current.value = "";
  };
  //
  return (
    <div
      style={{
        // border: "1px solid",
        height: "90vh",
        width: "95vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Messages user={user} />
      <div
        style={{
          display: "flex",
          gap: "1rem",
        }}
      >
        <input
          type="text"
          style={{ flex: 2 }}
          onChange={(e) => {
            setUser(e.target.value);
          }}
        />
        <input
          type="text"
          style={{ flex: 8 }}
          ref={textRef}
          onKeyUp={(e) => {
            if (e.keyCode === 13) {
              onSend();
            }
          }}
        />
      </div>
    </div>
  );
}

export default Chat;
