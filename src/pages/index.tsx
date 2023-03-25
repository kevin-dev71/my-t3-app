import { type NextPage } from "next";
import Head from "next/head";

import { api, type RouterOutputs } from "@/utils/api";
import { SignIn, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";

import { LoadingPage, LoadingSpinner } from "@/components/Loading";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate: createPost, isLoading: isPosting } =
    api.posts.create.useMutation({
      onSuccess: () => {
        setInput("");
        void ctx.posts.getAll.invalidate();
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;
        const errorMsg = errorMessage?.[0];
        if (errorMsg) {
          toast.error(errorMsg);
        } else {
          toast.error("Failed to post! Please try again later.");
        }
      },
    });

  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <Image
        src={user.profileImageUrl}
        alt={`Profile picture`}
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
      />
      <input
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
        value={input}
        type="text"
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input) {
              createPost({ content: input });
            }
          }
        }}
        disabled={isPosting}
      />
      {input !== "" && !isPosting && (
        <button
          onClick={() => createPost({ content: input })}
          disabled={isPosting}
        >
          Post
        </button>
      )}

      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Image
        src={author.profileImageUrl}
        className="h-14 w-14 rounded-full"
        alt={`@${author.username}'s profile picture`}
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex gap-1 font-bold text-slate-300">
          <span>{`@${author.username} `}</span>
          <span className="font-thin">{` . ${dayjs(
            post.createdAt
          ).fromNow()}`}</span>
        </div>
        <span className="text-xl">{post.content}</span>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: isPostsLoading } = api.posts.getAll.useQuery();

  if (isPostsLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col">
      {data?.map((post) => (
        <PostView key={post.post.id} {...post} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();

  // start fetching asap
  api.posts.getAll.useQuery();

  if (!isUserLoaded) return <div></div>;

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full border-x border-slate-400 md:max-w-2xl">
          <div className="border-b border-slate-400 p-4">
            <CreatePostWizard />
            {!isSignedIn && (
              <div className="flex justify-center">
                <SignInButton mode="modal" />
              </div>
            )}
            {!!isSignedIn && <SignOutButton />}
          </div>
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
          <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
