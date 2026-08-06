import { ImageResponse } from 'next/og'

export const alt = 'DNSHE 域名控制台'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#ffd84d',
          border: '30px solid #0f172a',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            background: '#1261ff',
            border: '28px solid #0f172a',
            borderRadius: '50%',
            display: 'flex',
            height: 278,
            justifyContent: 'center',
            width: 278,
          }}
        >
          <div
            style={{
              background: '#ffd84d',
              border: '24px solid #0f172a',
              borderRadius: '50%',
              height: 104,
              width: 104,
            }}
          />
        </div>
        <div
          style={{
            background: '#0f172a',
            height: 30,
            position: 'absolute',
            top: 72,
            width: 80,
          }}
        />
        <div
          style={{
            background: '#0f172a',
            bottom: 72,
            height: 30,
            position: 'absolute',
            width: 80,
          }}
        />
      </div>
    ),
    size,
  )
}
