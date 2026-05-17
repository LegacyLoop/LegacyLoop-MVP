import ReturnRequestClient from "./ReturnRequestClient";

type Params = Promise<{ token: string }>;

export const metadata = { title: "Return Request — Legacy-Loop" };

export default async function ReturnPage({ params }: { params: Params }) {
  const { token } = await params;
  return <ReturnRequestClient token={token} />;
}
