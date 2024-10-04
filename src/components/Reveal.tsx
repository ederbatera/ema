import {
    motion,
    useAnimation,
    useInView,
    useScroll,
    useTransform,
} from "framer-motion"
import { useEffect, useRef } from "react"


const Reveal = () => {

    const containerRef = useRef(null)

    const isInView = useInView(containerRef, { once: true })
    const mainControls = useAnimation()

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end end"],
    })

    const paragraphOneValue = useTransform(
        scrollYProgress,
        [0, 1],
        ["-100%", "0%"]
    )

    const paragraphTwoValue = useTransform(
        scrollYProgress,
        [0, 1],
        ["100%", "0%"]
    )

    useEffect(() => {
        if (isInView) {
            mainControls.start("visible")
        }
    }, [isInView])

    return (
        <>
            <motion.section >

                <section className="flex flex-col gap-10 mb-10" ref={containerRef}>
                    <motion.h1
                        className="text-5xl tracking-wide text-slate-100 text-center"
                        animate={mainControls}
                        initial="hidden"
                        variants={{
                            hidden: { opacity: 0, y: 75 },
                            visible: {
                                opacity: 1,
                                y: 0,
                            },
                        }}
                        transition={{ delay: 0.3 }}
                    >
                        Just Keep Scrolling
                    </motion.h1>
                    <motion.p
                        style={{ translateX: paragraphOneValue }}
                        className="text-slate-100 font-thin text-4xl w-1/2 mx-auto"
                    >
                        This is a basic tutorial on how to get up and running with Framer
                        Motion with some TailwindCSS. If you enjoyed this video, please leave
                        a like and also subscribe.
                    </motion.p>
                    <motion.p
                        style={{ translateX: paragraphTwoValue }}
                        className="text-slate-100 font-thin text-4xl w-1/2 mx-auto"
                    >
                        Have fun playing with Framer Motion. It is a very powerful library,
                        when used properly. Add some life to your websites.
                    </motion.p>
                </section>
            </motion.section>

        </>
    )
}

export default Reveal