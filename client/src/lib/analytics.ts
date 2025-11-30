import ReactGA from 'react-ga4'

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      gaOptions: {
        anonymizeIp: true,
      },
    })
    console.log('Google Analytics initialized')
  } else {
    console.warn('GA Measurement ID not found')
  }
}
