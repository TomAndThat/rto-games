export default function Footer() {
  return (
    <footer className="relative w-full text-center text-white bg-owl-purple mt-4 p-4">
      <img
        src="/images/catfish/divider/notification-bar-xxl.png"
        alt=""
        className="hidden xl:block 2xl:hidden w-full absolute top-0 left-0 right-0"
      />
      <img
        src="/images/catfish/divider/notification-bar-xl.png"
        alt=""
        className="hidden lg:block xl:hidden w-full absolute top-0 left-0 right-0"
      />
      <img
        src="/images/catfish/divider/notification-bar-lg.png"
        alt=""
        className="hidden md:block lg:hidden w-full absolute top-0 left-0 right-0"
      />
      <img
        src="/images/catfish/divider/notification-bar-md.png"
        alt=""
        className="hidden sm:block md:hidden w-full absolute top-0 left-0 right-0"
      />
      <img
        src="/images/catfish/divider/notification-bar-sm.png"
        alt=""
        className="block sm:hidden w-full absolute top-0 left-0 right-0"
      />

      <p className="font-heading lowercase text-xl">
        A daft game by{" "}
        <a
          href="https://www.releasetheowl.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-owl-yellow underline"
        >
          Release the Owl
        </a>
      </p>
    </footer>
  );
}
