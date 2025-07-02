import iconImage from '../../../../assets/icon.png';

export default function Logo(props) {
  return (
    <img
      {...props}
      src={iconImage}
      alt="Deep Journal Logo"
      style={{
        width: '114px',
        height: '119px',
        objectFit: 'contain',
        ...props.style
      }}
    />
  );
}
