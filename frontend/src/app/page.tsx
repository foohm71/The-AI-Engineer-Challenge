import Image from 'next/image';
import ChatForm from '@/components/ChatForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/robot.svg"
            alt="Friendly Robot"
            width={200}
            height={200}
            className="mb-6"
            priority
          />
          <h1 className="text-3xl font-bold text-center text-gray-900">
            Chat with AI
          </h1>
        </div>
        <ChatForm />
      </div>
    </main>
  );
}
