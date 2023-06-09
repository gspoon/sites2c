import React, { useState, useEffect } from "react";
import { auth } from "../../firebase-config";
import CardComponent from "../../Components/Cards/Card";
import CardForm from "../../Components/addCardForm/addCard";
import "../../styles/homeScreen.css";
import ResponsiveAppBar from "../../Components/Navbar/Navbar";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import writeUserData from "./homeScreenUtils";
import { getAllPosts } from "./homeScreenUtils";
import { CardProps } from "../../Components/Cards/Card";
import { DataSnapshot } from "firebase/database";
import LoadingIcon from "../../Components/loadingBlock/loadingIcon";

export default function HomeScreen() {
  const [allPosts, setPosts] = useState<CardProps[]>([]);
  const [isFormVisible, setIsFormVisible] = useState<boolean>(false);
  const [loadingIconVisible, setLoadingIconVisible] = useState<boolean>(false);
  const [currentUser, setUser] = useState<User | null>(auth.currentUser);
  const [postKeys, setPostKeys] = useState<string[]>([]);
  const navigate = useNavigate();

  function handleFormVisibility() {
    setIsFormVisible(true);
  }

  function closeForm() {
    setIsFormVisible(false);
    setLoadingIconVisible(true);
  }

  function handleDisplayPosts(currentPosts: CardProps[]) {
    setPosts((currentAllPosts) => {
      return [...currentAllPosts, ...currentPosts];
    });

    if (currentPosts.length === 1) {
      handlePostKeys([currentPosts[0].postKey!]);
    }
    setLoadingIconVisible(false);
  }

  function handlePostKeys(currentKeys: string[]) {
    setPostKeys((currentAllKeys) => {
      return [...currentAllKeys, ...currentKeys];
    });
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        setUser(user);
        writeUserData(user);
      } else {
        // User is signed out
        navigate("/");
      }
    });
    return () => {
      unsub();
    };
  }, [navigate]);

  useEffect(() => {
    getAllPosts().then((snapshot: DataSnapshot) => {
      // Handle the snapshot data here
      const data = snapshot.val();
      if (data) {
        let postKeys: string[] = Object.keys(data) as string[];
        console.log(postKeys);

        const cardDataArray: CardProps[] = (
          Object.values(data) as Array<{
            cardTitle: string;
            cardDescription: string;
            cardImage: string;
          }>
        ).map((currentEntry, index) => ({
          title: currentEntry.cardTitle,
          description: currentEntry.cardDescription,
          imageUrl: currentEntry.cardImage,
          postKey: postKeys[index],
        }));
        handleDisplayPosts(cardDataArray);
        handlePostKeys(postKeys);
      }
      // ...
    });
  }, []);

  return (
    <div className="container-xxl" id="homeScreen">
      <ResponsiveAppBar userId={currentUser ? currentUser.uid : null} />
      <div className="CardContainer">
        {/* //fix the key */}
        {allPosts.map((currentPost, index) => (
          <CardComponent
            postKey={postKeys[index]}
            title={currentPost.title} // Provide appropriate values for title, description, and imageUrl
            description={currentPost.description}
            imageUrl={currentPost.imageUrl}
            user={currentUser}
            key={index}
          />
        ))}
      </div>

      {currentUser && (
        <CardForm
          visibility={isFormVisible}
          onClose={closeForm}
          addPost={handleDisplayPosts}
          user={currentUser}
        />
      )}

      <LoadingIcon visible={loadingIconVisible} />

      <div className="form-popup container" id="popUpForm"></div>

      <button
        id="addEntryButton"
        type="button"
        className="btn"
        onClick={handleFormVisibility}
      >
        <span id="addIcon" className="material-symbols-outlined">
          add
        </span>{" "}
      </button>
    </div>
  );
}
