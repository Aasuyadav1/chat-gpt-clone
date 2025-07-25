"use server";
import { connectDB } from "@/db/db";
import { serializeData } from "@/lib/serialize-data";
import Thread from "@/db/models/thread.model";
import { auth } from "@/auth";
import Message from "@/db/models/message.model";
import { generateAiResponse } from "./chat.action";

export const getThread = async () => {
  const session = await auth();

  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }

  try {
    await connectDB();

    // Get all threads with populated folder and message data
    const threads = await Thread.find({
      userId: session.user.id,
    })
      .sort({ createdAt: -1 });


    const pinnedThreads = threads.filter(
      (thread) => thread.isPinned === true
    );

    const allThreadsWithOutPinned = threads.filter(
      (thread) => thread.isPinned === false
    );

    return {
      data: {
        pin: serializeData(pinnedThreads),
        chat: serializeData(allThreadsWithOutPinned),
      },
      error: null,
    };
  } catch (error: any) {
    console.error("Error in getThread:", error);
    return {
      data: null,
      error: error.message,
    };
  }
};
export const createThread = async ({
  title,
  _id,
}: {
  title?: string;
  _id: string;
}) => {
  const session = await auth();
  console.log("New thread created");
  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }

  try {
    await connectDB();

    const aiResponse = await generateAiResponse({
      message: `Create a 2-5 word title for this message: ${title}

      Rules:
      - Maximum 5 words
      - No quotes, no colons, no extra formatting
      - Just plain text
      - Be specific about the topic
      
      Examples:
      Learning React Hooks
      Today Weather Update
      JavaScript Debugging Help
      Chocolate Cake Recipe
      
      Response format: Just the title words, nothing else.`,
    });

    const thread = await Thread.create({
      _id: _id,
      userId: session.user.id,
      title: aiResponse.data || "New Thread",
    });

    return {
      data: serializeData(thread),
      error: null,
    };
  } catch (error: any) {
    console.log("error", error);
    return {
      data: null,
      error: error.message,
    };
  }
};

export const pinThread = async ({ threadId }: { threadId: string }) => {
  const session = await auth();

  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }
  try {
    await connectDB();

    const thread = await Thread.findOne({
      _id: threadId,
      userId: session.user.id,
    });

    if (!thread) {
      return {
        data: null,
        error: "Thread not found",
      };
    }

    thread.isPinned = !thread.isPinned;

    await thread.save();

    return {
      data: serializeData(thread),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error,
    };
  }
};

export const deleteThread = async ({ threadId }: { threadId: string }) => {
  const session = await auth();

  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }
  try {
    await connectDB();

    const thread = await Thread.findOne({
      _id: threadId,
      userId: session.user.id,
    });

    if (!thread) {
      return {
        data: null,
        error: "Thread not found",
      };
    }

    await Thread.deleteOne({ _id: threadId });


    return {
      data: serializeData(thread),
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error,
    };
  }
};

export const renameThread = async ({
  threadId,
  title,
}: {
  threadId: string;
  title: string;
}) => {
  const session = await auth();

  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }
  try {
    await connectDB();

    const thread = await Thread.findOne({
      _id: threadId,
      userId: session.user.id,
    });

    if (!thread) {
      return {
        data: null,
        error: "Thread not found",
      };
    }

    thread.title = title;

    await thread.save();

    return {
      data: serializeData(thread),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error,
    };
  }
};

export const searchThread = async ({ query }: { query?: string }) => {
  const session = await auth();

  if (!session?.user) {
    return {
      data: null,
      error: "Unauthorized",
    };
  }
  try {
    await connectDB();

    if (query) {
      const threads = await Thread.find({
        userId: session.user.id,
        title: { $regex: query, $options: "i" },
      })
        .sort({ createdAt: -1 })
        .select("threadId title isPinned createdAt");
      return {
        data: serializeData(threads),
        error: null,
      };
    }

    const threads = await Thread.find({
      userId: session.user.id,
    })
      .sort({ createdAt: -1 })
      .select("threadId title isPinned createdAt");
    return {
      data: serializeData(threads),
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error,
    };
  }
};