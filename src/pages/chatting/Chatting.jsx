import React, { useState, useEffect, useRef } from "react";
import { KH_SOCKET_URL } from "../../utils/Common";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import AxiosApi from "../../api/AxiosApi";

const ChatContainer = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ChatHeader = styled.div`
  font-size: 1.5em;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
`;

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 400px;
  overflow-y: auto;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  padding: 10px;
  margin-bottom: 20px;
`;

const Message = styled.div`
  max-width: 60%;
  padding: 10px;
  margin: 10px;
  border-radius: 20px;
  background-color: ${(props) => (props.isSender ? "#DCF8C6" : "#E0E0E0")};
  align-self: ${(props) => (props.isSender ? "flex-end" : "flex-start")};
  border: ${(props) =>
    props.isSender ? "1px solid #DCF8C6" : "1px solid #E0E0E0"};
`;

const Input = styled.input`
  padding: 10px;
  width: 70%;
  border-radius: 4px;
  border: 1px solid #ddd;
`;

const SendButton = styled.button`
  padding: 10px 15px;
  border: none;
  background-color: #4caf50;
  color: white;
  border-radius: 4px;
  margin-left: 10px;
  cursor: pointer;

  &:hover {
    background-color: #45a049;
  }
`;
const CloseButton = styled.button`
  padding: 10px 15px;
  border: none;
  background-color: #f44336;
  color: white;
  border-radius: 4px;
  margin-top: 10px;
  cursor: pointer;

  &:hover {
    background-color: #d32f2f;
  }
`;

const Chatting = () => {
  const [socketConnected, setSocketConnected] = useState(false); // 소켓 연결이 안되어 있으면 false
  const [inputMsg, setInputMsg] = useState("");
  const [chatList, setChatList] = useState([]);
  const { roomId } = useParams();
  const [chatName, setChatName] = useState("");
  const sender = window.localStorage.getItem("email");
  const ws = useRef(null); //기본 값은 null, 아무방이 없을 경우
  const navigate = useNavigate(); // useNavigate 훅 추가
  const userName = localStorage.getItem("name"); // 로컬스토리지에 닉네임 전달됨. 바로 닉네임 받으려고

  const onChangMsg = (e) => {
    setInputMsg(e.target.value);
  };

  const onEnterKey = (e) => {
    if (e.key === "Enter") onClickMsgSend(e);
  };

  const onClickMsgSend = (e) => {
    e.preventDefault();
    ws.current.send(
      JSON.stringify({
        type: "TALK",
        roomId: roomId,
        sender: sender,
        senderName: userName, // 닉네임도 보여지게끔
        message: inputMsg,
      })
    );
    setInputMsg("");
  };
  const onClickMsgClose = () => {
    ws.current.send(
      JSON.stringify({
        type: "CLOSE",
        roomId: roomId,
        sender: sender,
        senderName: userName,
        message: " - ",
      })
    );
    ws.current.close();
    navigate("/Chat");
  };

  // 이전 채팅 내용을 가져오는 함수
  const loadPreviousChat = () => {
    AxiosApi.recentChatLoad(roomId).then((res) => {
      const recentMessages = res.data;
      setChatList(recentMessages);
    });
  };
  useEffect(() => {
    console.log("방번호 : " + roomId);
    if (!ws.current) {
      // current가 없으면 새로운 웹소켓을 만든다
      ws.current = new WebSocket(KH_SOCKET_URL);
      ws.current.onopen = () => {
        console.log("connected to " + KH_SOCKET_URL);
        setSocketConnected(true); //소켓 연결시 true
      };
    }
    if (socketConnected) {
      ws.current.send(
        JSON.stringify({
          //json으로 데이터 보냄
          type: "ENTER", // 입~장~~
          roomId: roomId,
          sender: sender,
          senderName: userName,
          message: " - ",
        })
      );
      // loadPreviousChat();
    }
    ws.current.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      console.log(data.message);
      setChatList((prevItems) => [...prevItems, data]);
    };
  }, [socketConnected]);

  // 화면 하단으로 자동 스크롤
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatList]);
  useEffect(() => {
    fetchChatName();
    console.log(chatName);
  }, []);

  const fetchChatName = async () => {
    try {
      const res = await AxiosApi.chatInfo(roomId);
      console.log("결과결과:" + res.data.name);
      if (res.data !== null) {
        setChatName(res.data.name);
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <ChatContainer>
      <ChatHeader> {chatName}</ChatHeader>
      <MessagesContainer ref={chatContainerRef}>
        {chatList.map((chat, index) => (
          <Message key={index} isSender={chat.sender === sender}>
            {`${chat.senderName} > ${chat.message}`}
          </Message>
        ))}
      </MessagesContainer>
      <div>
        <Input
          placeholder="문자 전송"
          value={inputMsg}
          onChange={onChangMsg}
          onKeyUp={onEnterKey}
        />
        <SendButton onClick={onClickMsgSend}>전송</SendButton>
      </div>
      <CloseButton onClick={onClickMsgClose}>채팅 종료 하기</CloseButton>
    </ChatContainer>
  );
};

export default Chatting;
