import HomeClient from "@/src/components/HomeClient";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-sono-sky text-sono-navy">
      <header className="relative isolate overflow-hidden">
        {/* Header backdrop. To shift the image up/down or zoom, tune the two
            CSS props below — backgroundPosition (Y) and backgroundSize. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: "url(/gosoa-image.png)",
            backgroundSize: "cover",
            backgroundPosition: "center 85%",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-sono-navy/55 via-sono-sky/30 to-sono-sky"
        />
        <div className="relative mx-auto w-full max-w-3xl px-6 pt-14 pb-12">
          <p className="flex justify-end font-jump-regular mt-4 text-xs tracking-widest text-white drop-shadow-[0_1px_2px_rgba(33,61,101,0.6)]">
            Fake Goyang Sono Arena
          </p>
          <h1 className="flex justify-center font-court pt-3 text-4xl leading-none text-white drop-shadow-[0_2px_6px_rgba(33,61,101,0.55)] sm:text-6xl">
            여름 고소아
          </h1>
          <p className="pt-6 max-w-md text-sm text-white drop-shadow-[0_1px_2px_rgba(33,61,101,0.55)]">
            고소아 못 가는 여름을 위해 집단지성이 필요합니다
            <br />
            같이 재밌는 비시즌 보내요!!
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-4 w-full max-w-3xl flex-1 px-6 pb-16">
        <HomeClient />
      </main>
    </div>
  );
}
