import { StyleSheet } from 'react-native'

// Shared auth styles used by auth screens/components.
export default StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FFF7F8', // soft warm background
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#FF5864',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    color: '#FF5864',
    fontWeight: '600',
  },
})
