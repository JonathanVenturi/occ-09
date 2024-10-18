/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

jest.mock("../app/store", () => mockStore)

describe("Given that I am connected as an employee", () => {

  // Mock localStorage and log as employee before each test
  beforeEach(() => {
    jest.spyOn(mockStore, 'bills')
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
  })

  describe("When I am on the Bills Page", () => {

    // Initialize router and navigate to the Bills page before each test
    beforeEach(() => {
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
    })

    test("Then bill icon in vertical layout should be highlighted", async () => {

      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()

    })

    test("Then bills should be fetched from the mock API (integration test)", async () => {

      const billsInstance = new Bills({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      const fetchedBills = await billsInstance.getBills()
      expect(fetchedBills).toHaveLength(4)
      expect(fetchedBills[0].formatedDate).toBe("4 Avr. 04")
      expect(fetchedBills[1].formatedDate).toBe("1 Jan. 01")
      expect(screen.getByText('encore')).toBeTruthy()
      expect(screen.getAllByText('Refused')).toHaveLength(2)
      
    })

    test("Then bills should be ordered from earliest to latest", () => {

      document.body.innerHTML = BillsUI({ data: bills })
      
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)

    })

    describe("When I click on the eye icon", () => {

      test("Then a popup should open", () => {

        const billsInstance = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })

        // Emulating the modal function from jQuery
        const modal = document.getElementById('modaleFile')
        $.fn.modal = jest.fn((arg) => {
          if (arg === 'show') { modal.classList.add('show') }
        })

        // Getting the first "eye icon" and simulating a click
        const eyeIcon = screen.getAllByTestId('icon-eye')[0]
        const handleClickIconEye = jest.fn(() => billsInstance.handleClickIconEye(eyeIcon))
        eyeIcon.addEventListener('click', handleClickIconEye)
        userEvent.click(eyeIcon)

        // Then we expect...
        expect(handleClickIconEye).toHaveBeenCalled() // ...the click event to be called
        expect($.fn.modal).toHaveBeenCalledWith('show') // ...the "show modal" function to be called
        expect(modal).toBeTruthy() // ...the modal to exist
        expect(modal.classList.contains('show')).toBeTruthy() // ...the modal to be shown

      })

    })

    describe("When I click on the button to create a new bill", () => {

      test("It should navigate to the NewBill page and render it", () => {

        // Display the Bills page
        document.body.innerHTML = BillsUI({ data: bills })
        let route = '';
        const onNavigate = (pathname) => {
          route = pathname
          document.body.innerHTML = ROUTES({ pathname })
        }
        const billsInstance = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })

        // When we click on the button
        const button = screen.getByTestId('btn-new-bill')
        fireEvent.click(button);

        // Then we expect...
        expect(route).toBe(ROUTES_PATH['NewBill']); // ...to navigate to the "NewBill" page
        expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy(); // ...the page being rendered
        expect(screen.getAllByText('Envoyer', { exact: false })).toHaveLength(2) // ...double checking

      })

    })

    describe('When an error occurs on API', () => {

      test('fetches bills from an API and fails with 404 message error', async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return { list: () => Promise.reject(new Error('Erreur 404')) }
        })
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()

      })

      test('fetches bills from an API and fails with 500 message error', async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return { list: () => Promise.reject(new Error('Erreur 500')) }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()

      })

    })

  })

})